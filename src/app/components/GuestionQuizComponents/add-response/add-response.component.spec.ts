import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddResponseComponent } from './add-response.component';

describe('AddResponseComponent', () => {
  let component: AddResponseComponent;
  let fixture: ComponentFixture<AddResponseComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AddResponseComponent]
    });
    fixture = TestBed.createComponent(AddResponseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
