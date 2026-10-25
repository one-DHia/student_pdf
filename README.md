# StudentPDF

StudentPDF est une application web qui rassemble des outils pour convertir, organiser et modifier des fichiers PDF. Les traitements sont exécutés dans le navigateur, sans compte utilisateur ni serveur applicatif propre au projet.

L’interface est disponible en français et en anglais. L’application est conçue pour ordinateur, tablette et mobile, et peut être installée comme PWA sur les navigateurs compatibles.

## Fonctionnalités

### Créer un PDF

- Convertir des documents Word (`.docx`), des feuilles Excel (`.xlsx`, `.csv`), des présentations PowerPoint (`.pptx`), des images et du HTML ou texte en PDF.
- Scanner des pages avec la caméra de l’appareil et les assembler en PDF.

### Exporter depuis un PDF

- Extraire le texte vers Word (`.docx`) ou Markdown (`.md`).
- Exporter le contenu textuel organisé par page vers Excel (`.xlsx`).
- Exporter les pages sous forme d’images PNG ou JPEG dans une archive ZIP.
- Créer un PowerPoint (`.pptx`) avec une diapositive image par page du PDF.

### Organiser et modifier les pages

- Fusionner plusieurs PDF.
- Extraire une plage de pages ou séparer toutes les pages dans une archive ZIP.
- Réordonner, faire pivoter ou supprimer des pages.
- Ajouter une numérotation personnalisable.

### Signer, protéger et optimiser

- Ajouter une signature dessinée et un filigrane textuel.
- Protéger un PDF par mot de passe ou déverrouiller un fichier avec son mot de passe.
- Réduire la taille d’un PDF par conversion des pages en images JPEG.
- Tenter de reconstruire un PDF endommagé.
- Effectuer l’OCR d’images et de toutes les pages d’un PDF, avec choix de la langue.

Les outils acceptent le traitement par lots lorsque cette option est indiquée dans l’interface.

## Technologies

- React 19 et Vite 5
- `pdf-lib` et `pdfjs-dist` pour lire, rendre et modifier les PDF
- Tesseract.js pour la reconnaissance de texte
- JSZip et FileSaver pour les archives et téléchargements
- `docx`, Mammoth et SheetJS (`xlsx`) pour les conversions de documents
- Lucide React pour les icônes

## Prérequis

- Node.js et npm compatibles avec les versions déclarées dans le projet.
- Un accès au registre npm lors de la première installation des dépendances.

## Installation et développement

Depuis la racine du projet :

```bash
npm ci
npm run dev
```

Vite affiche l’adresse locale du serveur de développement dans le terminal.

## Commandes disponibles

| Commande | Description |
| --- | --- |
| `npm run dev` | Lance le serveur de développement Vite. |
| `npm run build` | Compile l’application dans le dossier `dist/`. |
| `npm run preview` | Sert localement le dernier build de `dist/`. |
| `npm run lint` | Lance Oxlint. Oxlint n’est pas déclaré dans les dépendances du projet et doit être installé séparément pour que cette commande fonctionne. |

Aucun script de tests automatisés n’est actuellement défini dans `package.json`.

Pour générer puis prévisualiser un build :

```bash
npm run build
npm run preview
```

## Organisation du code

```text
src/
├── App.jsx                    # Composition de l’application et état global
├── main.jsx                   # Point d’entrée React
├── index.css                  # Styles globaux et thèmes
├── App.css                    # Styles de l’application
├── components/
│   ├── ToolGrid.jsx            # Catalogue, catégories et filtres des outils
│   ├── ToolModal.jsx           # Sélection de fichiers et exécution des outils
│   ├── FileDropzone.jsx        # Dépôt et sélection des fichiers
│   ├── PageGridEditor.jsx      # Réorganisation et édition des pages
│   ├── ResultPreviewer.jsx     # Aperçu et téléchargement des résultats
│   ├── CameraScanner.jsx       # Capture des pages avec la caméra
│   ├── SignaturePad.jsx        # Saisie de signature
│   └── ...                     # Navigation, en-tête, PWA et soutien
└── utils/
    ├── convertToPdf.js         # Conversions vers PDF
    ├── convertFromPdf.js       # Exports depuis PDF
    ├── pdfOperations.js        # Fusion, pages, sécurité, OCR, etc.
    ├── pdfHelper.js            # Chargement, rendu, miniatures et tailles
    └── translations.js         # Libellés français et anglais

public/
├── sw.js                       # Service worker et cache réseau
├── manifest.json               # Configuration PWA
└── ...                         # Icônes, favicon et fichiers statiques
```

## Confidentialité et fonctionnement

Les fichiers sélectionnés sont traités par le code JavaScript dans le navigateur et ne sont pas envoyés à un serveur StudentPDF. La caméra n’est activée qu’avec l’autorisation du navigateur. Aucun compte ni base de données n’est utilisé par cette application.

Certains composants chargent des ressources externes, notamment le worker PDF.js depuis cdnjs, les polices Google Fonts et les ressources nécessaires à l’OCR. Une connexion Internet peut donc être nécessaire au premier chargement ou au premier usage de certaines fonctions. Le service worker met en cache une partie des ressources du site ; cela ne garantit pas que toutes les fonctions soient disponibles hors ligne dans tous les navigateurs.

## Limites connues

- **PDF vers PowerPoint :** chaque page est placée comme image sur une diapositive. Le rendu visuel est conservé, mais le texte et les éléments ne sont pas éditables individuellement.
- **Compression :** les pages sont rasterisées en JPEG. Le texte ne reste pas sélectionnable, les liens ne sont pas conservés, et la taille cible est indicative ; le résultat peut dépasser la limite demandée.
- **Conversions Word, Excel et PowerPoint :** elles reconstruisent le document à partir du texte et d’une structure simplifiée. La mise en page, les images, les polices et les tableaux complexes peuvent différer de l’original.
- **PDF vers Excel :** l’extraction s’appuie sur la position du texte et ne garantit pas la reconstruction parfaite de tableaux complexes.
- **Déverrouillage :** le document déverrouillé est reconstruit à partir des pages rendues ; son contenu peut ne plus être sélectionnable comme du texte.
- **Réparation :** les fichiers gravement endommagés ou chiffrés ne peuvent pas toujours être récupérés.
- **OCR :** la précision dépend de la qualité du scan, de l’orientation et de la langue choisie.

## Déploiement

Le projet est configuré pour Vercel avec Vite. Le build de production utilise :

```bash
npm run build
```

Le dossier de sortie est `dist/`. Les fichiers de liaison locaux de Vercel (`.vercel/`) et les dépendances (`node_modules/`) ne doivent pas être publiés dans le dépôt.
