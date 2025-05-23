
const db = require('../db');

const TicketModel = {
  async getAvailableSeats() {
    try {
      const [confirmed] = await db.query("SELECT COUNT(*) AS count FROM tickets WHERE status = 'confirmed'");
      const [rac] = await db.query("SELECT COUNT(*) AS count FROM tickets WHERE status = 'rac'");
      const [waiting] = await db.query("SELECT COUNT(*) AS count FROM tickets WHERE status = 'waiting'");

      return {
        statusCode: 200,
        message: 'Seat availability fetched successfully.',
        data: {
          confirmed: 63 - confirmed[0].count,
          rac: 18 - rac[0].count,
          waiting: 10 - waiting[0].count
        }
      };
    } catch (error) {
      console.error("Seat Availability Error:", error);
      return {
        statusCode: 500,
        message: 'Failed to fetch seat availability',
        data: {
          confirmed: 0,
          rac: 0,
          waiting: 0
        }
      };
    }
  },

  async bookTicket(passenger) {
    try {
      const { data } = await this.getAvailableSeats();
      const seats = data;
      let status;

      if (seats.confirmed > 0) status = 'confirmed';
      else if (seats.rac > 0) status = 'rac';
      else if (seats.waiting > 0) status = 'waiting';
      else {
        return {
          statusCode: 400,
          status: 'unavailable',
          message: 'No tickets available'
        };
      }

      // Insert main passenger
      const [passengerResult] = await db.query(
        'INSERT INTO passengers (name, age, gender, has_child, child_age, parent_id) VALUES (?, ?, ?, ?, ?, ?)',
        [
          passenger.name,
          passenger.age,
          passenger.gender,
          Array.isArray(passenger.children) && passenger.children.length > 0,
          null,
          null
        ]
      );

      const parentId = passengerResult.insertId;

      // Insert ticket for main passenger
      const [ticketResult] = await db.query(
        'INSERT INTO tickets (passenger_id, status, berth_preference) VALUES (?, ?, ?)',
        [
          parentId,
          status,
          passenger.berth_preference || null
        ]
      );

      const ticketId = ticketResult.insertId;

      // Allocate berth for parent only (never for children under 5)
      const berthType = status === 'rac' ? 'rac' : (passenger.berth_preference || 'lower');
      const berthNumber = berthType.substring(0, 1).toUpperCase() + ticketId;

      await db.query(
        'INSERT INTO berth_allocations (ticket_id, berth_type, berth_number, allocated) VALUES (?, ?, ?, ?)',
        [ticketId, berthType, berthNumber, true]
      );

      // Insert child records (if any)
      if (Array.isArray(passenger.children)) {
        for (const child of passenger.children) {
          if (child.age < 5) {
            await db.query(
              'INSERT INTO passengers (name, age, gender, has_child, child_age, parent_id) VALUES (?, ?, ?, ?, ?, ?)',
              [
                child.name,
                child.age,
                child.gender,
                false,
                null,
                parentId
              ]
            );
          }
        }
      }

      return {
        statusCode: 200,
        status,
        ticketId,
        message: `Ticket booked successfully (${status.toUpperCase()})`
      };
    } catch (error) {
      console.error("Booking Error:", error);
      return {
        statusCode: 500,
        message: 'Internal server error'
      };
    }
  },

  async cancelTicket(ticketId) {
    try {
      const [result] = await db.query('SELECT * FROM tickets WHERE id = ?', [ticketId]);
      if (result.length === 0) {
        return {
          statusCode: 404,
          message: 'Ticket not found'
        };
      }

      const ticket = result[0];
      await db.query('DELETE FROM tickets WHERE id = ?', [ticketId]);
      await db.query('DELETE FROM berth_allocations WHERE ticket_id = ?', [ticketId]);

      let updateMessage = '';

      if (ticket.status === 'confirmed') {
        const [rac] = await db.query("SELECT * FROM tickets WHERE status = 'rac' ORDER BY id LIMIT 1");
        if (rac.length > 0) {
          await db.query('UPDATE tickets SET status = ? WHERE id = ?', ['confirmed', rac[0].id]);
          updateMessage += `RAC Ticket ID ${rac[0].id} promoted to CONFIRMED. `;

          const [waiting] = await db.query("SELECT * FROM tickets WHERE status = 'waiting' ORDER BY id LIMIT 1");
          if (waiting.length > 0) {
            await db.query('UPDATE tickets SET status = ? WHERE id = ?', ['rac', waiting[0].id]);
            updateMessage += `Waiting Ticket ID ${waiting[0].id} promoted to RAC.`;
          }
        }
      }

      return {
        statusCode: 200,
        status: 'cancelled',
        message: 'Ticket cancelled successfully.',
        details: updateMessage || 'No queue promotions applied.'
      };
    } catch (error) {
      console.error("Cancellation Error:", error);
      return {
        statusCode: 500,
        message: 'Internal server error'
      };
    }
  },

  async getAllBookedTickets() {
    try {
      const [tickets] = await db.query(`
        SELECT t.id as ticket_id, p.id as parent_id, p.name, p.age, p.gender, t.status, b.berth_type, b.berth_number
        FROM tickets t
        JOIN passengers p ON t.passenger_id = p.id
        LEFT JOIN berth_allocations b ON t.id = b.ticket_id
        WHERE t.status IN ('confirmed', 'rac', 'waiting')
        ORDER BY t.id ASC
      `);

      const ticketMap = {};
      for (const ticket of tickets) {
        ticket.children = [];
        ticketMap[ticket.parent_id] = ticket;
      }

      const [children] = await db.query(`
        SELECT name, age, gender, parent_id FROM passengers
        WHERE parent_id IS NOT NULL
      `);

      for (const child of children) {
        if (ticketMap[child.parent_id]) {
          ticketMap[child.parent_id].children.push({
            name: child.name,
            age: child.age,
            gender: child.gender
          });
        }
      }

      return {
        statusCode: 200,
        message: 'Booked tickets fetched successfully.',
        data: Object.values(ticketMap)
      };
    } catch (error) {
      console.error("Fetch Booked Tickets Error:", error);
      return {
        statusCode: 500,
        message: 'Failed to fetch booked tickets',
        data: []
      };
    }
  }
}


module.exports = TicketModel;
