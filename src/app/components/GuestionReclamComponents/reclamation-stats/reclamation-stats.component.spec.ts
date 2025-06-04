import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReclamationStatsComponent } from './reclamation-stats.component';

describe('ReclamationStatsComponent', () => {
  let component: ReclamationStatsComponent;
  let fixture: ComponentFixture<ReclamationStatsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ReclamationStatsComponent]
    });
    fixture = TestBed.createComponent(ReclamationStatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
