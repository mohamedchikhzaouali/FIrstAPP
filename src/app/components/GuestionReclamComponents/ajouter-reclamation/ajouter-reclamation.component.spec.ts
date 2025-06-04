import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AjouterReclamationComponent } from './ajouter-reclamation.component';

describe('AjouterReclamationComponent', () => {
  let component: AjouterReclamationComponent;
  let fixture: ComponentFixture<AjouterReclamationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AjouterReclamationComponent]
    });
    fixture = TestBed.createComponent(AjouterReclamationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
