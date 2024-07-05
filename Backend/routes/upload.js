const express = require('express');
const multer = require('multer');
const { Vimeo } = require('vimeo');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

const vimeoClient = new Vimeo(
  '075cbf434aad7073ad222529ff8915977b9a456b',
  'jxEepYx3kgDogy4jsH2Y/0raOAPZkqbEojElccVJqRyvfmZ8ykqkUX+3z412on2iV8zo24p1PpX/JjbZXRv+OWS6XvdINZ2zwaiZbRd/ZF4E/Nm2OMB7+iKrONgU1KAe',
  'e4f59c0ee8981c3316bce9a693d9009b'
);

router.post('/upload-video', upload.single('video'), (req, res) => {
  const filePath = req.file.path;

  vimeoClient.upload(
    filePath,
    {},
    (uri) => {
      vimeoClient.request(uri + '?fields=link', (error, body) => {
        if (error) {
          return res.status(500).json({ error: 'Error retrieving video URL' });
        }
        res.json({ url: body.link });
      });
    },
    (bytesUploaded, bytesTotal) => {
      const percentage = (bytesUploaded / bytesTotal * 100).toFixed(2);
      console.log(`Uploaded: ${percentage}%`);
    },
    (error) => {
      console.error('Failed to upload video:', error);
      res.status(500).json({ error: 'Failed to upload video' });
    }
  );
});

module.exports = router;
