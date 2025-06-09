import { inngest } from "../inngest/client.js";
import Ticket from "../models/ticket.js";

export const createTicket = async (req, res) => {
  try {
    // Extract title and description from request body
    const { title, description } = req.body;

    // Validate title and description
    if (!title || !description) {
      return res
        .status(400)
        .json({ message: "Title and description are required" });
    }

    // Create a new ticket
    const newTicket = Ticket.create({
      title,
      description,
      createdBy: req.user._id.toString(),
    });

    // Send an event to Inngest to trigger the onTicketCreated function
    await inngest.send({
      name: "ticket/created",
      data: {
        ticketId: (await newTicket)._id.toString(),
        title,
        description,
        createdBy: req.user._id.toString(),
      },
    });

    // Return a success response with the new ticket
    return res.status(201).json({
      message: "Ticket created and processing started",
      ticket: newTicket,
    });
  } catch (error) {
    // Log any errors and return a 500 response
    console.error("Error creating ticket", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getTickets = async (req, res) => {
  try {
    // Get the current user
    
    const user = req.user;

    // Determine which tickets to retrieve based on user role
    let tickets = [];
    if (user.role !== "user") {
      // Retrieve all tickets for admin/moderator users
      tickets = Ticket.find({})
        .populate("assignedTo", ["email", "_id"])
        .sort({ createdAt: -1 }); // sort in descending order (newest tickets first
    } else {
      // Retrieve tickets created by the current user
      tickets = await Ticket.find({ createdBy: user._id })
        .select("title description status createdAt")
        .sort({ createdAt: -1 });
    }

    // Return the retrieved tickets
    return res.status(200).json(tickets);
  } catch (error) {
    // Log any errors and return a 500 response
    console.error("Error fetching tickets", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getTicket = async (req, res) => {
  try {
    // Get the current user
    const user = req.user;

    // Retrieve the ticket by ID
    let ticket;
    if (user.role !== "user") {
      // Retrieve the ticket for admin/moderator users
      ticket = Ticket.findById(req.params.id).populate("assignedTo", [
        "email",
        "_id",
      ]);
    } else {
      // Retrieve the ticket created by the current user
      ticket = Ticket.findOne({
        createdBy: user._id,
        _id: req.params.id,
      }).select("title description status createdAt");
    }

    // Check if the ticket exists
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Return the retrieved ticket
    return res.status(200).json({ ticket });
  } catch (error) {
    // Log any errors and return a 500 response
    console.error("Error fetching ticket", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};






