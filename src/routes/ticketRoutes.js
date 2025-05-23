const express = require('express');
const router = express.Router();
const TicketController = require('../controllers/ticketController');

router.get('/available', TicketController.getAvailable);
router.get('/booked', TicketController.getBooked);
router.post('/book', TicketController.book);
router.post('/cancel/:ticketId', TicketController.cancel);

module.exports = router;
