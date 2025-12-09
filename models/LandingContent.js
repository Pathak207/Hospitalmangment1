import mongoose from 'mongoose';

const LandingContentSchema = new mongoose.Schema({
  global: {
    type: Boolean,
    default: true,
    required: true
  },
  hero: {
    title: {
      type: String,
      default: 'Modern Practice Management Made Simple'
    },
    subtitle: {
      type: String,
      default: 'Streamline your healthcare practice with our comprehensive management system. From patient records to billing, everything you need in one place.'
    },
    ctaText: {
      type: String,
      default: 'Start 14-Day Free Trial'
    },
    ctaSecondaryText: {
      type: String,
      default: 'Watch Demo'
    }
  },
  stats: [{
    number: {
      type: String,
      required: true
    },
    label: {
      type: String,
      required: true
    }
  }],
  features: {
    title: {
      type: String,
      default: 'Everything You Need to Run Your Practice'
    },
    subtitle: {
      type: String,
      default: 'Our comprehensive platform provides all the tools healthcare providers need to deliver exceptional patient care while streamlining operations.'
    }
  },
  pricing: {
    title: {
      type: String,
      default: 'Simple, Transparent Pricing'
    },
    subtitle: {
      type: String,
      default: 'Choose the plan that fits your practice. All plans include a 14-day free trial with no setup fees or long-term commitments.'
    }
  },
  testimonials: {
    title: {
      type: String,
      default: 'Trusted by Healthcare Providers'
    },
    subtitle: {
      type: String,
      default: 'See what doctors are saying about DoctorCare'
    },
    items: [{
      name: {
        type: String,
        required: true
      },
      role: {
        type: String,
        required: true
      },
      avatar: {
        type: String,
        required: true
      },
      content: {
        type: String,
        required: true
      },
      rating: {
        type: Number,
        min: 1,
        max: 5,
        default: 5
      }
    }]
  },
  cta: {
    title: {
      type: String,
      default: 'Ready to Transform Your Practice?'
    },
    subtitle: {
      type: String,
      default: 'Join thousands of healthcare providers who trust DoctorCare to manage their practice efficiently.'
    },
    buttonText: {
      type: String,
      default: 'Start Your Free Trial Today'
    }
  }
}, {
  timestamps: true
});

// Create index for efficient queries
LandingContentSchema.index({ global: 1 });

export default mongoose.models.LandingContent || mongoose.model('LandingContent', LandingContentSchema); 