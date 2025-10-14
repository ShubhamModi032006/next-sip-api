import { NextResponse } from 'next/server';
import dbConnect from '@/utils/dbConnect';
import User from '@/models/User';
import VirtualPortfolio from '@/models/VirtualPortfolio';

// --- GET: Fetch all portfolio holdings for a specific user ---
export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ error: 'Username is required.' }, { status: 400 });
    }

    // First, find the user by their username
    const user = await User.findOne({ username: username });
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Then, find all holdings that belong to that user's ID
    const holdings = await VirtualPortfolio.find({ userId: user._id }).sort({ investmentDate: -1 });
    return NextResponse.json(holdings);
  } catch (error) {
    console.error('API GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch portfolio holdings.' }, { status: 500 });
  }
}

// --- POST: Create a new portfolio holding ---
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { username, ...holdingData } = body;

    if (!username || !holdingData.schemeCode || !holdingData.units || !holdingData.avgPrice) {
      return NextResponse.json({ error: 'Missing required fields (username, schemeCode, units, avgPrice).' }, { status: 400 });
    }
    
    const user = await User.findOne({ username: username });
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }
    
    // Add the user's actual database ID to the holding before saving
    const newHoldingData = { ...holdingData, userId: user._id };
    const newHolding = await VirtualPortfolio.create(newHoldingData);

    return NextResponse.json(newHolding, { status: 201 });
  } catch (error)
  {
    console.error('API POST Error:', error);
    return NextResponse.json({ error: 'Failed to create portfolio holding.' }, { status: 500 });
  }
}

// --- PUT: Update an existing portfolio holding ---
export async function PUT(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id'); // The ID of the holding to update
    const body = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Holding ID is required.' }, { status: 400 });
    }
    
    const updatedHolding = await VirtualPortfolio.findByIdAndUpdate(id, body, { new: true, runValidators: true });

    if (!updatedHolding) {
      return NextResponse.json({ error: 'Holding not found.' }, { status: 404 });
    }

    return NextResponse.json(updatedHolding);
  } catch (error) {
    console.error('API PUT Error:', error);
    return NextResponse.json({ error: 'Failed to update portfolio holding.' }, { status: 500 });
  }
}

// --- DELETE: Remove a portfolio holding ---
export async function DELETE(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Holding ID is required.' }, { status: 400 });
    }

    const deletedHolding = await VirtualPortfolio.findByIdAndDelete(id);

    if (!deletedHolding) {
      return NextResponse.json({ error: 'Holding not found.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Holding deleted successfully.' });
  } catch (error) {
    console.error('API DELETE Error:', error);
    return NextResponse.json({ error: 'Failed to delete portfolio holding.' }, { status: 500 });
  }
}