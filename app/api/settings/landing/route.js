import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import LandingContent from '@/models/LandingContent';
import { getAuthSession } from '@/lib/auth';

// GET /api/settings/landing - Fetch landing page content (public access)
export async function GET() {
  try {
    await dbConnect();
    
    // Get global landing content (no organization filter)
    const content = await LandingContent.findOne({ global: true });
    
    if (!content) {
      // Return current actual content if none exists
      const defaultContent = {
        hero: {
          title: 'Modern Practice Management Made Simple',
          subtitle: 'Streamline your healthcare practice with our comprehensive management system. From patient records to billing, everything you need in one place.',
          ctaText: 'Start 14-Day Free Trial',
          ctaSecondaryText: 'Watch Demo',
        },
        stats: [
          { number: '10,000+', label: 'Healthcare Providers' },
          { number: '500,000+', label: 'Patients Managed' },
          { number: '99.9%', label: 'Uptime Guarantee' },
          { number: '24/7', label: 'Customer Support' }
        ],
        features: {
          title: 'Everything You Need to Run Your Practice',
          subtitle: 'Our comprehensive platform provides all the tools healthcare providers need to deliver exceptional patient care while streamlining operations.',
        },
        pricing: {
          title: 'Simple, Transparent Pricing',
          subtitle: 'Choose the plan that fits your practice. All plans include a 14-day free trial with no setup fees or long-term commitments.'
        },
        testimonials: {
          title: 'Trusted by Healthcare Providers',
          subtitle: 'See what doctors are saying about DoctorCare',
          items: [
            {
              name: 'Dr. Sarah Johnson',
              role: 'Family Medicine',
              avatar: 'SJ',
              content: 'DoctorCare has revolutionized how I manage my practice. The scheduling system alone has saved me hours every week.',
              rating: 5
            },
            {
              name: 'Dr. Michael Chen',
              role: 'Pediatrics',
              avatar: 'MC',
              content: 'The patient management features are incredible. I can access complete medical histories instantly.',
              rating: 5
            },
            {
              name: 'Dr. Emily Rodriguez',
              role: 'Internal Medicine',
              avatar: 'ER',
              content: 'Best investment I have made for my practice. The billing integration has streamlined everything.',
              rating: 5
            }
          ]
        },
        cta: {
          title: 'Ready to Transform Your Practice?',
          subtitle: 'Join thousands of healthcare providers who trust DoctorCare to manage their practice efficiently.',
          buttonText: 'Start Your Free Trial Today'
        }
      };
      
      const response = NextResponse.json(defaultContent);
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      return response;
    }

    const response = NextResponse.json(content);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  } catch (error) {
    console.error('Error fetching landing content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/settings/landing - Save landing page content
export async function POST(request) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admin can update global landing content
    if (session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();
    
    await dbConnect();
    
    // Update or create global landing content
    const updatedContent = await LandingContent.findOneAndUpdate(
      { global: true },
      {
        global: true,
        hero: data.hero,
        stats: data.stats,
        features: data.features,
        pricing: data.pricing,
        testimonials: data.testimonials,
        cta: data.cta,
        updatedAt: new Date()
      },
      { 
        upsert: true, 
        new: true,
        runValidators: true 
      }
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Landing page content updated successfully',
      content: updatedContent 
    });
  } catch (error) {
    console.error('Error saving landing content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 