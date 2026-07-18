import { Suspense } from 'react';
import CreateWizard from './wizard';

export default function CreatePage() {
  return (
    <Suspense>
      <CreateWizard />
    </Suspense>
  );
}
