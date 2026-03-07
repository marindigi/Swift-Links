import React, { useState, useEffect } from 'react';
import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride';

interface OnboardingTourProps {
  theme: 'light' | 'dark';
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ theme }) => {
  const [run, setRun] = useState(false);

  useEffect(() => {
    // Only run if not already seen
    const hasSeenTour = localStorage.getItem('hasSeenTour');
    if (!hasSeenTour) {
      setRun(true);
    }
  }, []);

  const steps: Step[] = [
    {
      target: '.tour-shortener',
      content: 'Enter your long URL here to shorten it instantly.',
      disableBeacon: true,
    },
    {
      target: '.tour-custom-domains',
      content: 'Use your own custom domains for branded links.',
    },
    {
      target: '.tour-analytics',
      content: 'Track clicks, locations, and devices for your links here.',
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false);
      localStorage.setItem('hasSeenTour', 'true');
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#6366f1', // brand color
          backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
          textColor: theme === 'dark' ? '#f3f4f6' : '#1f2937',
        },
      }}
    />
  );
};
