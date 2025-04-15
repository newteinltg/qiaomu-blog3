'use client';

import React from 'react';
import NextScriptLoader from './NextScriptLoader';

type ScriptLoaderWrapperProps = {
  position: 'head' | 'body_start' | 'body_end';
};

export default function ScriptLoaderWrapper({ position }: ScriptLoaderWrapperProps) {
  // Temporarily disabled to troubleshoot navigation menu issues
  console.log(`ScriptLoader for ${position} temporarily disabled`);
  return null;
}
