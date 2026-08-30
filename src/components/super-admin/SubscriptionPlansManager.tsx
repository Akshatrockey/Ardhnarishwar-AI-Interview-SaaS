import React, { useState } from 'react';
import { SubscriptionPlan, PlanType } from '../../types';
import { AppDataStore } from '../../services/storage';
import { CreditCard, CheckCircle2, Zap, Shield, Sparkles } from 'lucide-react';

export const SubscriptionPlansManager: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>(SUBSCRIPTION_PLANS_DATA);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl font-extrabold text-white">SaaS Subscription Plans & Tiers</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Commercial SaaS packaging, candidate quota limits, and AI custom rule entitlements.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p, idx) => {
          const isPopular = p.id === 'ENTERPRISE_ROBOTICS';
          return (
            <div
              key={p.id}
              className={`p-6 rounded-3xl bg-slate-900 border shadow-2xl flex flex-col justify-between relative ${
                isPopular ? 'border-cyan-500/80 bg-gradient-to-b from-slate-900 to-cyan-950/30' : 'border-slate-800'
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md">
                  Most Popular For Robotics
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-white">{p.name}</h2>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-extrabold text-white">${p.pricePerMonth}</span>
                    <span className="text-xs text-slate-400 font-mono">/ month</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Job Openings:</span>
                    <strong className="text-white">{p.maxJobs === 999 ? 'Unlimited' : p.maxJobs}</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Evaluations:</span>
                    <strong className="text-cyan-400">{p.maxCandidatesPerMonth}/mo</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Storage Retention:</span>
                    <strong className="text-slate-200">{p.videoStorageDays} Days</strong>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Features Included</div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {p.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-6">
                <button
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isPopular
                      ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg shadow-cyan-500/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  Configure Tier Limits
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SUBSCRIPTION_PLANS_DATA: SubscriptionPlan[] = [
  {
    id: 'STARTER',
    name: 'Robotics Starter',
    pricePerMonth: 499,
    billingCycle: 'MONTHLY',
    maxJobs: 5,
    maxCandidatesPerMonth: 100,
    customQuestions: false,
    aiModelTuning: false,
    dedicatedSupport: false,
    whiteLabeling: false,
    videoStorageDays: 30,
    features: [
      'Up to 5 Active Job Postings',
      '100 AI Candidate Evaluations/mo',
      'Standard Question Bank',
      'Video & Audio Recording',
      'WebRTC Hardware Diagnostic',
      'Basic PDF Dossier Export'
    ]
  },
  {
    id: 'GROWTH',
    name: 'Growth Scale',
    pricePerMonth: 1499,
    billingCycle: 'MONTHLY',
    maxJobs: 20,
    maxCandidatesPerMonth: 500,
    customQuestions: true,
    aiModelTuning: false,
    dedicatedSupport: true,
    whiteLabeling: false,
    videoStorageDays: 90,
    features: [
      'Up to 20 Active Job Postings',
      '500 AI Candidate Evaluations/mo',
      'Custom Company Question Banks',
      'Advanced STAR & Fluency Scoring',
      'Clickable Question Timeline Replay',
      'Role-Based Recruiter Permissions',
      'Priority Email & Slack Support'
    ]
  },
  {
    id: 'ENTERPRISE_ROBOTICS',
    name: 'Enterprise Robotics Suite',
    pricePerMonth: 3999,
    billingCycle: 'MONTHLY',
    maxJobs: 999,
    maxCandidatesPerMonth: 10000,
    customQuestions: true,
    aiModelTuning: true,
    dedicatedSupport: true,
    whiteLabeling: true,
    videoStorageDays: 365,
    features: [
      'Unlimited Job Postings & Rounds',
      '10,000+ AI Evaluations/mo',
      'Custom AI Rubrics & Weight Tuning',
      'Full Multi-Tenant Audit Trails',
      'Military-Grade Video Proctoring',
      'Custom Domain & White-Labeling',
      '24/7 Dedicated Solutions Engineer',
      'On-Premise / Hybrid Storage Support'
    ]
  }
];
