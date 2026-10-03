const router = require('express').Router();
const controller = require('../controllers/lead.controller');
const importController = require('../controllers/import.controller');
const validate = require('../middleware/validate');
const {
  createLeadSchema,
  updateLeadSchema,
  updateStatusSchema,
  createNoteSchema,
  idParamSchema,
  noteParamSchema,
  listLeadsQuerySchema,
} = require('../validators/lead.validator');

// CSV Import & Export endpoints (must be before /:id)
router.get('/sample-csv', importController.downloadSampleCsv);
router.post('/upload-csv', importController.upload.single('file'), importController.uploadCsv);
router.get('/import-status/:jobId', importController.getJobStatus);
router.get('/import-status/:jobId/invalid-csv', importController.downloadInvalidCsv);
router.get('/export-csv', controller.exportCsv);

// Leads
router.get('/', validate({ query: listLeadsQuerySchema }), controller.list);
router.post('/', validate({ body: createLeadSchema }), controller.create);
router.get('/:id', validate({ params: idParamSchema }), controller.getOne);
router.patch('/:id', validate({ params: idParamSchema, body: updateLeadSchema }), controller.update);
router.patch('/:id/status', validate({ params: idParamSchema, body: updateStatusSchema }), controller.updateStatus);
router.delete('/:id', validate({ params: idParamSchema }), controller.remove);

// Notes (sub-resource of a lead)
router.get('/:id/notes', validate({ params: idParamSchema }), controller.listNotes);
router.post('/:id/notes', validate({ params: idParamSchema, body: createNoteSchema }), controller.addNote);
router.delete('/:id/notes/:noteId', validate({ params: noteParamSchema }), controller.removeNote);

module.exports = router;
