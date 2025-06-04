import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListeReclamationsComponent  } from './liste-reclamation.component';

describe('ListeReclamationsComponent', () => {
  let component: ListeReclamationsComponent;
  let fixture: ComponentFixture<ListeReclamationsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ListeReclamationsComponent]
    });
    fixture = TestBed.createComponent(ListeReclamationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
