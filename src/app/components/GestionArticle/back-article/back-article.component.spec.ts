import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BackArticleComponent } from './back-article.component';

describe('BackArticleComponent', () => {
  let component: BackArticleComponent;
  let fixture: ComponentFixture<BackArticleComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BackArticleComponent]
    });
    fixture = TestBed.createComponent(BackArticleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
