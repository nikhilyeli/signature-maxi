import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SignatureMaxiComponent } from './signature-maxi';

describe('SignatureMaxiComponent', () => {
  let component: SignatureMaxiComponent;
  let fixture: ComponentFixture<SignatureMaxiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignatureMaxiComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SignatureMaxiComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
