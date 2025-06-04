import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateResponseComponent } from './update-response.component';

describe('UpdateResponseComponent', () => {
  let component: UpdateResponseComponent;
  let fixture: ComponentFixture<UpdateResponseComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UpdateResponseComponent]
    });
    fixture = TestBed.createComponent(UpdateResponseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
