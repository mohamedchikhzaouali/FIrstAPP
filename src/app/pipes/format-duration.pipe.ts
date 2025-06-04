import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatDuration' // Nom utilisé dans le template HTML: {{ value | formatDuration }}
})
export class FormatDurationPipe implements PipeTransform {

  transform(value: number | null | undefined): string {
    // Gérer les cas où la valeur n'est pas un nombre valide ou est nulle/undefined
    if (value === null || value === undefined || isNaN(value) || value < 0) {
      return '0s'; // Ou 'N/A', ou '' selon votre préférence
    }

    if (value === 0) {
        return '0s';
    }

    // Convertir les millisecondes en secondes totales
    const totalSeconds = Math.floor(value / 1000);

    // Calculer les heures, minutes et secondes restantes
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    // Construire la chaîne de caractères du résultat
    let result = '';
    if (hours > 0) {
      result += `${hours}h `;
    }
    if (minutes > 0) {
      result += `${minutes}m `;
    }
    // Toujours afficher les secondes si le temps total est inférieur à une minute,
    // ou s'il y a des secondes restantes après les heures/minutes.
    if (seconds > 0 || result === '') {
        result += `${seconds}s`;
    }

    // Retourner la chaîne formatée (enlever l'espace final si présent)
    return result.trim();
  }
}