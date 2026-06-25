# Keywi — kit d'identité

Assets prêts à intégrer dans l'app. Vert chair du kiwi + gris-brun de la peau.

## Contenu

| Fichier | Usage |
|---|---|
| `logo-mark.svg` | Symbole principal (kiwi + clé + monogramme K) |
| `logo-mark-dark.svg` | Variante pour fond sombre |
| `app-icon.svg` | Icône d'application 512×512 (kiwi plein cadre, coins squircle) |
| `badge-seal.svg` | Sceau « Point relais agréé » (vitrine / app) |
| `keyfob.svg` | Porte-clés physique (rond, gravure) |
| `KeywiLogo.jsx` | Composant React du logo (light/dark, avec ou sans wordmark) |
| `tokens.css` | Variables CSS de couleurs, rayons, ombres, polices |
| `tokens.json` | Mêmes tokens en JSON (config Tailwind, JS, etc.) |
| `preview.html` | Aperçu de tous les assets |

## Couleurs

- **Kiwi Green** `#7CB518` — principale, boutons, actions
- **Lime** `#C6F03A` — accent punchy / fond sombre
- **Kiwi Skin** `#8A7252` — confiance, bordures, texte secondaire
- **Cream** `#FBFAF3` — fond de l'app
- **Forest** `#15331E` — fond sombre, texte
- **Ink** `#14331E` — texte principal

Voir `tokens.css` / `tokens.json` pour la liste complète.

## Polices

- Titres : **Bricolage Grotesque** (800 pour le monogramme)
- Texte : **DM Sans**

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap" rel="stylesheet">
```

> Le « K » des logos est rendu en texte avec Bricolage Grotesque. Charge la police
> avant d'afficher le SVG. Pour un asset 100 % autonome (impression, favicon),
> convertis le texte en tracé dans ton éditeur vectoriel (« Vectoriser le texte »).

## React

```jsx
import KeywiLogo, { KeywiMark } from "./keywi-assets/KeywiLogo.jsx";

<KeywiLogo size={40} withWordmark />        // logo + texte
<KeywiMark size={32} variant="dark" />      // symbole seul, fond sombre
```

## CSS tokens

```css
@import "./keywi-assets/tokens.css";

.btn-primary {
  background: var(--kw-green);
  color: var(--kw-cream);
  border-radius: var(--kw-radius-md);
  font-family: var(--kw-font-display);
}
```

## Tailwind (extrait depuis tokens.json)

```js
// tailwind.config.js
const t = require("./keywi-assets/tokens.json");
module.exports = {
  theme: { extend: {
    colors: {
      kiwi:  t.color.green,
      lime:  t.color.lime,
      skin:  t.color.skin,
      cream: t.color.cream,
      forest:t.color.forest,
    },
    fontFamily: {
      display: [t.font.display, "sans-serif"],
      body:    [t.font.body, "sans-serif"],
    },
  }},
};
```
