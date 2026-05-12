import { CommonModule } from '@angular/common';
import { Component, input, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
export type BadgeColor =
  | 'blue'
  | 'dark'
  | 'red'
  | 'green'
  | 'yellow'
  | 'indigo'
  | 'purple'
  | 'pink';

export type BadgeSize = 'xs' | 'sm';

/**
 * Componente visual para mostrar una insignia (`badge`) con color, tamaño e iconografía configurables.
 *
 * - Soporta temas oscuros (`dark mode`) y clases `hover` reactivas.
 * - Puede actuar como texto plano o como enlace (`href`), si se desea navegación.
 * - Extensible visualmente mediante `customStyle` o clases externas.
 */
@Component({
  selector: 'app-badge',
  imports: [CommonModule, RouterModule],
  templateUrl: './badge.component.html',
  styles: ``,
})
export class BadgeComponent {
  /** Color temático del badge (`blue`, `red`, `yellow`, etc.) */
  color = input<BadgeColor>('blue');
  /** Tamaño del texto dentro del badge (`xs` o `sm`) */
  size = input<BadgeSize>('xs');
  /** Enlace a seguir si el badge es clickeable */
  href = input<string>('');
  /** Controla si se muestra solo un ícono en lugar de texto */
  iconOnly = input<boolean>(false);
  /** Estilos CSS personalizados adicionales para el wrapper */
  customStyle = input<string>('');

  /** Mapa de clases por color para aplicar estilos dinámicos */
  colorClasses: Record<BadgeColor, string> = {
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-200 dark:text-blue-800 group-hover:bg-blue-200 dark:group-hover:bg-blue-300',
    dark: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 group-hover:bg-gray-200 dark:group-hover:bg-gray-600',
    red: 'bg-red-100 text-red-800 dark:bg-red-200 dark:text-red-900 group-hover:bg-red-200 dark:group-hover:bg-red-300',
    green:
      'bg-green-100 text-green-800 dark:bg-green-200 dark:text-green-900 group-hover:bg-green-200 dark:group-hover:bg-green-300',
    yellow:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-200 dark:text-yellow-900 group-hover:bg-yellow-200 dark:group-hover:bg-yellow-300',
    indigo:
      'bg-indigo-100 text-indigo-800 dark:bg-indigo-200 dark:text-indigo-900 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-300',
    purple:
      'bg-purple-100 text-purple-800 dark:bg-purple-200 dark:text-purple-900 group-hover:bg-purple-200 dark:group-hover:bg-purple-300',
    pink: 'bg-pink-100 text-pink-800 dark:bg-pink-200 dark:text-pink-900 group-hover:bg-pink-200 dark:group-hover:bg-pink-300',
  };

  /** Mapa de clases por tamaño de texto */
  sizeClasses: Record<BadgeSize, string> = {
    xs: 'text-xs',
    sm: 'text-sm',
  };
}
