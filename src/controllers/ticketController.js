const TicketModel = require('../models/ticketModel');

const TicketController = {
  async getAvailable(req, res) {
    try {
      const seats = await TicketModel.getAvailableSeats();
      res.status(seats.statusCode).json(seats);
    } catch (error) {
      console.error('Get Available Seats Error:', error);
      res.status(500).json({ statusCode: 500, message: 'Internal server error' });
    }
  },

  async getBooked(req, res) {
    try {
      const tickets = await TicketModel.getAllBookedTickets();
      res.status(tickets.statusCode).json(tickets);
    } catch (error) {
      console.error('Get Booked Tickets Error:', error);
      res.status(500).json({ statusCode: 500, message: 'Internal server error' });
    }
  },

  async book(req, res) {
    try {
      const passenger = req.body;
      const result = await TicketModel.bookTicket(passenger);
      res.status(result.statusCode).json(result);
    } catch (error) {
      console.error('Book Ticket Error:', error);
      res.status(500).json({ statusCode: 500, message: 'Internal server error' });
    }
  },

  async cancel(req, res) {
    try {
      const { ticketId } = req.params;
      const result = await TicketModel.cancelTicket(ticketId);
      res.status(result.statusCode).json(result);
    } catch (error) {
      console.error('Cancel Ticket Error:', error);
      res.status(500).json({ statusCode: 500, message: 'Internal server error' });
    }
  }
};

module.exports = TicketController;
