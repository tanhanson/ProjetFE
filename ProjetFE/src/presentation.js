import { init } from './main.js';
import { initCarPreview } from './car-preview.js';
import { initIntroScene } from './intro-scene.js';

const deck = new Reveal({
  transition: 'fade',
  controls: true,
  progress: true,
  width: '100%',
  height: '100%',
  margin: 0,
  minScale: 1,
  maxScale: 1,
  disableLayout: true, //  désactive le scaling automatique de Reveal
});

deck.initialize().then(() => {
  
  // Lancer la scène d'intro avec un délai pour que le canvas ait une taille
  setTimeout(() => {
    initIntroScene('intro-canvas');
  }, 100);

  // Lancer la voiture quand on arrive sur cette slide
  deck.on('slidechanged', (event) => {
    if (event.indexh === 2) {
      initCarPreview('car-canvas');
    }

      if (event.indexh === 6) {
    initCarPreview('car-canvas'); 
  }

  });

});

document.addEventListener('click', (e) => {
  if (e.target && e.target.id === 'enter-portfolio') {
    const presentation = document.getElementById('presentation');
    const portfolio = document.getElementById('portfolio');

    presentation.style.transition = 'opacity 1s';
    presentation.style.opacity = '0';

    setTimeout(() => {
      presentation.style.display = 'none';
      portfolio.style.display = 'block';
      init();
    }, 1000);
  }
});