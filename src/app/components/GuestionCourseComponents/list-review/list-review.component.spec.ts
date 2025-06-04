import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListReviewComponent } from './list-review.component';

describe('ListReviewComponent', () => {
  let component: ListReviewComponent;
  let fixture: ComponentFixture<ListReviewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ListReviewComponent]
    });
    fixture = TestBed.createComponent(ListReviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
