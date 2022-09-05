const express = require('express');
const ticketCtl = require('../controllers/tickets');

const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth');


router.route('/image/:id').get(ticketCtl.getFile);

router.use(protect);
router.route('/deletebyids').post(protect, ticketCtl.deleteTicketBbIds);
router.route('/add').post(protect, ticketCtl.createTicket);
router.route('/').post(protect, ticketCtl.getTickets);
router
    .route('/:id')
    .get(ticketCtl.getTicket)
    .post(ticketCtl.updateTicket)
    .delete(ticketCtl.deleteTicket);

module.exports = router;
