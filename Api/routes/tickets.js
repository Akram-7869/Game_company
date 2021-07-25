const express = require('express');
const ticketCtl = require('../controllers/tickets');

const router = express.Router({ mergeParams: true });
const { protect} = require('../middleware/auth');
 
router.use(protect);

router.route('/add').post(ticketCtl.createTicket);
router.route('/').post(ticketCtl.getTickets);

router
    .route('/:id')
    .get(ticketCtl.getTicket)
    .post( ticketCtl.updateTicket)
    .delete(ticketCtl.deleteTicket);

module.exports = router;
