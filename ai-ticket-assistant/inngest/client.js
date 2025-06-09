import { Inngest } from "inngest";

import dotenv from 'dotenv';
dotenv.config();

export const inngest = new Inngest({ 
    id: "ticketing-system",
    apiKey: process.env.INNGEST_EVENT_KEY, 
 });