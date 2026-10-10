import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TopmenubarComponent } from './topmenubar/topmenubar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TopmenubarComponent],
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {}
