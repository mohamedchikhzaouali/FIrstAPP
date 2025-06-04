import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BackMenuAdminComponent } from './back-menu-admin.component';

describe('BackMenuAdminComponent', () => {
  let component: BackMenuAdminComponent;
  let fixture: ComponentFixture<BackMenuAdminComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BackMenuAdminComponent]
    });
    fixture = TestBed.createComponent(BackMenuAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
