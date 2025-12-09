import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import dbConnect from '@/lib/db';
import OrganizationModel from '@/models/Organization';
import UserModel from '@/models/User';
import SubscriptionModel from '@/models/Subscription';
import { emailService } from '@/lib/email';
import { hash } from 'bcrypt';

// GET - Get all organizations (Super Admin only)
export async function GET(request) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admin can view all organizations
    if (session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const emailCheck = searchParams.get('email');

    // If email parameter is provided, check if email exists
    if (emailCheck) {
      const existing = await OrganizationModel.findOne({ email: emailCheck.toLowerCase() });
      return NextResponse.json({ exists: !!existing });
    }

    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const organizations = await OrganizationModel.find(query)
      .populate({
        path: 'subscription',
        select: 'status endDate billingCycle amount plan trialEndDate',
        populate: {
          path: 'plan',
          select: 'name monthlyPrice yearlyPrice'
        }
      })
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await OrganizationModel.countDocuments(query);

    return NextResponse.json({
      success: true,
      organizations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

// POST - Create a new organization with owner account
export async function POST(request) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admin can create organizations
    if (session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const data = await request.json();
    console.log('🔍 Organization creation data received:', JSON.stringify(data, null, 2));
    
    const { 
      name, 
      email, 
      phone, 
      address,
      website,
      timezone,
      currency,
      branding,
      // Owner details
      ownerName,
      ownerEmail,
      ownerPassword,
      ownerPhone
    } = data;
    
    console.log('📍 Address data:', JSON.stringify(address, null, 2));

    // Validate required fields
    if (!name || !email || !ownerName || !ownerEmail || !ownerPassword) {
      return NextResponse.json({ 
        error: 'Organization name, email, owner name, email, and password are required' 
      }, { status: 400 });
    }

    // Check if organization email already exists
    const existingOrg = await OrganizationModel.findOne({ email: email.toLowerCase() });
    if (existingOrg) {
      return NextResponse.json({ 
        error: 'Organization with this email already exists' 
      }, { status: 400 });
    }

    // Check if owner email already exists
    const existingUser = await UserModel.findOne({ email: ownerEmail.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ 
        error: 'User with this email already exists' 
      }, { status: 400 });
    }

    // Normalize address data - handle both flat and nested address objects
    let normalizedAddress = {};
    if (address) {
      // If address is already in the correct format (flat object with street, city, etc.)
      if (typeof address.street === 'string') {
        normalizedAddress = {
          street: address.street || '',
          city: address.city || '',
          state: address.state || '',
          zipCode: address.zipCode || '',
          country: address.country || ''
        };
      } else {
        // If address is empty or malformed, use defaults
        normalizedAddress = {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        };
      }
    } else {
      // No address provided, use defaults
      normalizedAddress = {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      };
    }

    // Create organization
    const organization = await OrganizationModel.create({
      name,
      email: email.toLowerCase(),
      phone,
      address: normalizedAddress,
      website,
      timezone: timezone || 'UTC',
      currency: currency || 'USD',
      branding: branding || {},
    });

    // Create owner user account
    const hashedPassword = await hash(ownerPassword, 12);
    const owner = await UserModel.create({
      name: ownerName,
      email: ownerEmail.toLowerCase(),
      password: hashedPassword,
      role: 'admin',
      organization: organization._id,
      phone: ownerPhone,
    });

    // Update organization with owner reference
    await OrganizationModel.findByIdAndUpdate(organization._id, {
      owner: owner._id,
    });

    // Return organization with owner details
    const populatedOrganization = await OrganizationModel.findById(organization._id)
      .populate('owner', 'name email phone');

    // Send welcome email to the new subscriber (only if not skipped)
    const { skipWelcomeEmail = false, subscriptionType = 'trial' } = data;
    
    if (!skipWelcomeEmail) {
      try {
        console.log('📧 Sending subscriber welcome email...');
        
        const userData = {
          firstName: ownerName.split(' ')[0] || ownerName,
          lastName: ownerName.split(' ').slice(1).join(' ') || '',
          email: ownerEmail
        };

        const organizationData = {
          name: organization.name
        };

        // Send trial email for trial subscriptions
        const subscriptionData = {
          isTrialOnly: true,
          trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
          planName: 'Trial',
          billingCycle: 'monthly',
          amount: 0
        };

        await emailService.sendSubscriberWelcomeEmail(userData, organizationData, subscriptionData);
        console.log('✅ Subscriber welcome email sent successfully');
      } catch (emailError) {
        console.error('❌ Failed to send subscriber welcome email:', emailError);
        // Don't fail the organization creation if email fails
      }
    } else {
      console.log('📧 Skipping welcome email - paid subscription will handle email sending');
    }

    return NextResponse.json({
      success: true,
      message: 'Organization and owner account created successfully',
      organization: populatedOrganization,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
} 