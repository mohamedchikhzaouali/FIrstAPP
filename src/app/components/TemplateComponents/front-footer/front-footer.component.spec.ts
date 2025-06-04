import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FrontFooterComponent } from './front-footer.component';

describe('FrontFooterComponent', () => {
  let component: FrontFooterComponent;
  let fixture: ComponentFixture<FrontFooterComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FrontFooterComponent]
    });
    fixture = TestBed.createComponent(FrontFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
