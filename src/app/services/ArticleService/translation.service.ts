import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private sourceLang = new BehaviorSubject<string>('fr');
  private targetLang = new BehaviorSubject<string>('en');
  private apiUrl = 'https://api.mymemory.translated.net/get';

  constructor(private http: HttpClient) {
    this.setLanguages('fr', 'en');
  }

  setLanguages(source: string, target: string) {
    if (source === target) {
      throw new Error('Source and target languages must be different');
    }
    this.sourceLang.next(source);
    this.targetLang.next(target);
    localStorage.setItem('sourceLanguage', source);
    localStorage.setItem('targetLanguage', target);
  }

  translatePage(elements: NodeListOf<Element>): void {
    const sourceLang = this.sourceLang.getValue();
    const targetLang = this.targetLang.getValue();

    document.body.setAttribute('dir', targetLang === 'ar' ? 'rtl' : 'ltr');

    document.querySelectorAll('.translate-placeholder').forEach(element => {
      const placeholder = element.getAttribute('placeholder');
      if (placeholder) {
        this.translateText(placeholder, sourceLang, targetLang).subscribe(
          translatedText => {
            element.setAttribute('placeholder', translatedText);
          }
        );
      }
    });

    elements.forEach(element => {
      const text = element.textContent?.trim();
      if (text) {
        this.translateText(text, sourceLang, targetLang).subscribe(
          translatedText => {
            if (translatedText) {
              element.textContent = translatedText;
              if (targetLang === 'ar') {
                element.classList.add('rtl-text');
              } else {
                element.classList.remove('rtl-text');
              }
            }
          },
          error => {
            console.error('Translation error:', error);
            element.textContent = `[${targetLang}] ${text}`;
          }
        );
      }
    });
  }

  private translateText(text: string, sourceLang: string, targetLang: string): Observable<string> {
    const params = {
      q: text,
      langpair: `${sourceLang}|${targetLang}`,
      charset: 'UTF-8'
    };

    return this.http.get(this.apiUrl, { params }).pipe(
      map((response: any) => response.responseData.translatedText),
      catchError((error: HttpErrorResponse) => {
        console.error('Translation API error:', error);
        return of(`[${targetLang}] ${text}`);
      })
    );
  }

  getSourceLang(): Observable<string> {
    return this.sourceLang.asObservable();
  }

  getTargetLang(): Observable<string> {
    return this.targetLang.asObservable();
  }
} 