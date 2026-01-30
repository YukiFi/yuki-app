import { NextRequest, NextResponse } from "next/server";
import { getContacts, addContact, removeContact, getUserByWalletAddress, getUserByUsername } from "@/lib/db";

// GET /api/contacts - Get user's saved contacts
export async function GET(request: NextRequest) {
  try {
    const walletAddress = request.headers.get("x-wallet-address");
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address required" },
        { status: 401 }
      );
    }

    // Get the current user
    const user = await getUserByWalletAddress(walletAddress);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const contacts = await getContacts(user.id);
    
    // Transform to a cleaner format
    const formattedContacts = contacts.map(c => ({
      id: c.id,
      userId: c.contact_user_id,
      username: c.contact_username,
      displayName: c.contact_display_name,
      avatarUrl: c.contact_avatar_url,
      walletAddress: c.contact_wallet_address,
      nickname: c.nickname,
      addedAt: c.created_at,
    }));

    return NextResponse.json({ contacts: formattedContacts });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/contacts - Add a new contact by username
export async function POST(request: NextRequest) {
  try {
    const walletAddress = request.headers.get("x-wallet-address");
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { username, nickname } = body;

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Get the current user
    const currentUser = await getUserByWalletAddress(walletAddress);
    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Find the user to add as contact
    const cleanUsername = username.startsWith("@") ? username : `@${username}`;
    const contactUser = await getUserByUsername(cleanUsername);
    
    if (!contactUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Can't add yourself
    if (contactUser.id === currentUser.id) {
      return NextResponse.json(
        { error: "Cannot add yourself as a contact" },
        { status: 400 }
      );
    }

    // Add the contact
    const contact = await addContact(currentUser.id, contactUser.id, nickname);
    
    if (!contact) {
      return NextResponse.json(
        { error: "Failed to add contact" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      contact: {
        id: contact.id,
        userId: contactUser.id,
        username: contactUser.username,
        displayName: contactUser.display_name,
        avatarUrl: contactUser.avatar_url,
        walletAddress: contactUser.wallet_address,
        nickname: contact.nickname,
        addedAt: contact.created_at,
      },
    });
  } catch (error) {
    console.error("Error adding contact:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/contacts - Remove a contact
export async function DELETE(request: NextRequest) {
  try {
    const walletAddress = request.headers.get("x-wallet-address");
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const contactUserId = searchParams.get("userId");

    if (!contactUserId) {
      return NextResponse.json(
        { error: "Contact user ID is required" },
        { status: 400 }
      );
    }

    // Get the current user
    const currentUser = await getUserByWalletAddress(walletAddress);
    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const removed = await removeContact(currentUser.id, contactUserId);
    
    if (!removed) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing contact:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

