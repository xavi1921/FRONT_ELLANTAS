  const express = require('express');
  const path = require('path');
  const app = express();

  const DIST = path.join(__dirname, 'dist/client/browser');
  const PORT = 4200;

  app.use(express.static(DIST));

  // Redirige cualquier ruta al index.html para el router de Angular
  app.get('*', (req, res) => {
    res.sendFile(path.join(DIST, 'index.html'));
  });

  app.listen(PORT, () => {
    console.log(`Frontend corriendo en puerto ${PORT}`);
  });
