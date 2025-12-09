import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { getAuthSession } from '@/lib/auth';
import ActivityModel from '@/models/Activity';

export async function GET(request) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    
    // Build query - filter by organization for data isolation
    const query = {};
    
    // Super admin can see all activities, regular users only their organization's activities
    if (session.user.role !== 'super_admin') {
      if (!session.user.organization) {
        return NextResponse.json({ error: 'No organization associated with user' }, { status: 403 });
      }
      query.organization = session.user.organization;
    }
    
    // For regular users, also filter by user ID (optional - you can remove this if you want org-wide activities)
    // query.user = session.user.id;
    
    // Add type filter if provided
    if (type && type !== 'all') {
      query.type = type;
    }
    
    // Add search functionality if provided
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get total count
    const total = await ActivityModel.countDocuments(query);
    
    // Get activities with pagination
    const activitiesData = await ActivityModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Format activities
    const activities = activitiesData.map(activity => {
      // Calculate time difference
      const now = new Date();
      const diff = Math.floor((now - activity.createdAt) / 1000 / 60); // in minutes
      
      let timeAgo;
      if (diff < 60) {
        timeAgo = `${diff} mins ago`;
      } else if (diff < 24 * 60) {
        timeAgo = `${Math.floor(diff / 60)} hours ago`;
      } else {
        timeAgo = `${Math.floor(diff / (60 * 24))} days ago`;
      }
      
      let icon, color;
      switch (activity.type) {
        case 'lab':
          icon = 'FileSearch';
          color = 'bg-blue-500';
          break;
        case 'appointment':
          icon = 'CheckCircle2';
          color = 'bg-green-500';
          break;
        case 'prescription':
          icon = 'FileText';
          color = 'bg-purple-500';
          break;
        case 'critical_alert':
          icon = 'AlertTriangle';
          color = 'bg-red-500';
          break;
        case 'referral':
          icon = 'ClipboardCheck';
          color = 'bg-teal-500';
          break;
        default:
          icon = 'Calendar';
          color = 'bg-amber-500';
      }
      
      return {
        id: activity._id.toString(),
        title: activity.title,
        description: activity.description,
        time: timeAgo,
        icon,
        color,
        type: activity.type,
        alert: activity.alert
      };
    });
    
    // Calculate total pages
    const totalPages = Math.ceil(total / limit);
    
    return NextResponse.json({ 
      activities,
      pagination: {
        total,
        totalPages,
        page,
        limit
      }
    });
  } catch (error) {
    console.error('Error getting activities:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Mark all activities as read
export async function PATCH(request) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    // Build query for marking activities as read
    const updateQuery = { alert: true };
    
    // Super admin can mark all activities, regular users only their organization's activities
    if (session.user.role !== 'super_admin') {
      if (!session.user.organization) {
        return NextResponse.json({ error: 'No organization associated with user' }, { status: 403 });
      }
      updateQuery.organization = session.user.organization;
    }
    
    // Update all activities for the organization to mark as read (set alert to false)
    await ActivityModel.updateMany(
      updateQuery,
      { $set: { alert: false } }
    );
    
    return NextResponse.json({ message: 'All activities marked as read' });
  } catch (error) {
    console.error('Error marking activities as read:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 