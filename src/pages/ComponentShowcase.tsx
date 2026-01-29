import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Toggle } from '../components/ui/Toggle';
import { Avatar } from '../components/ui/Avatar';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Dropdown } from '../components/ui/Dropdown';

export default function ComponentShowcase(): JSX.Element {
  const [toggleChecked, setToggleChecked] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectValue, setSelectValue] = useState('');
  const [loadingBtn, setLoadingBtn] = useState(false);

  const handleLoadingClick = (): void => {
    setLoadingBtn(true);
    setTimeout(() => setLoadingBtn(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Component Showcase
      </h1>

      {/* Buttons */}
      <section className="mb-8" data-testid="button-section">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Button
        </h2>
        <Card>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button isLoading={loadingBtn} onClick={handleLoadingClick}>
                {loadingBtn ? 'Loading...' : 'Click to Load'}
              </Button>
              <Button disabled>Disabled</Button>
            </div>
          </div>
        </Card>
      </section>

      {/* Badges */}
      <section className="mb-8" data-testid="badge-section">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Badge
        </h2>
        <Card>
          <div className="flex flex-wrap gap-3">
            <Badge variant="green">Active</Badge>
            <Badge variant="yellow">Pending</Badge>
            <Badge variant="blue">Info</Badge>
            <Badge variant="red">Error</Badge>
            <Badge variant="gray">Default</Badge>
          </div>
        </Card>
      </section>

      {/* Card */}
      <section className="mb-8" data-testid="card-section">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Card
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card padding="sm" shadow="sm">
            <p className="text-sm text-gray-600 dark:text-gray-400">Small padding, small shadow</p>
          </Card>
          <Card padding="md" shadow="md">
            <p className="text-sm text-gray-600 dark:text-gray-400">Medium padding, medium shadow</p>
          </Card>
          <Card padding="lg" shadow="lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Large padding, large shadow</p>
          </Card>
        </div>
      </section>

      {/* Input */}
      <section className="mb-8" data-testid="input-section">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Input
        </h2>
        <Card>
          <div className="space-y-4 max-w-md">
            <Input
              label="Email"
              placeholder="Enter your email"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <Input
              label="With Error"
              placeholder="Type something..."
              error="This field is required"
            />
            <Input
              label="Disabled"
              placeholder="Can't type here"
              disabled
            />
          </div>
        </Card>
      </section>

      {/* Select */}
      <section className="mb-8" data-testid="select-section">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Select
        </h2>
        <Card>
          <div className="max-w-md">
            <Select
              label="Role"
              placeholder="Choose a role..."
              options={[
                { label: 'Developer', value: 'developer' },
                { label: 'Designer', value: 'designer' },
                { label: 'Manager', value: 'manager' },
              ]}
              value={selectValue}
              onChange={setSelectValue}
            />
          </div>
        </Card>
      </section>

      {/* Toggle */}
      <section className="mb-8" data-testid="toggle-section">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Toggle
        </h2>
        <Card>
          <div className="space-y-4">
            <Toggle
              label="Enable notifications"
              checked={toggleChecked}
              onChange={setToggleChecked}
            />
            <Toggle
              label="Disabled toggle"
              checked={true}
              onChange={() => {}}
              disabled
            />
          </div>
        </Card>
      </section>

      {/* Avatar */}
      <section className="mb-8" data-testid="avatar-section">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Avatar
        </h2>
        <Card>
          <div className="flex flex-wrap gap-4 items-end">
            <Avatar name="John Doe" size="sm" />
            <Avatar name="Jane Smith" size="md" showStatus isOnline />
            <Avatar name="Bob Wilson" size="lg" showStatus isOnline={false} />
            <Avatar
              src="https://i.pravatar.cc/100?u=1"
              alt="User photo"
              size="md"
            />
          </div>
        </Card>
      </section>

      {/* ProgressBar */}
      <section className="mb-8" data-testid="progress-section">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          ProgressBar
        </h2>
        <Card>
          <div className="space-y-4">
            <ProgressBar value={25} label="Tasks" showValue color="blue" />
            <ProgressBar value={50} label="Progress" showValue color="green" />
            <ProgressBar value={75} label="Storage" showValue color="yellow" />
            <ProgressBar value={90} label="Budget" showValue color="red" />
          </div>
        </Card>
      </section>

      {/* Dropdown */}
      <section className="mb-8" data-testid="dropdown-section">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Dropdown
        </h2>
        <Card>
          <div className="flex gap-4">
            <Dropdown
              placeholder="Actions..."
              items={[
                { label: 'Edit', value: 'edit' },
                { label: 'Duplicate', value: 'duplicate' },
                { label: 'Archive', value: 'archive' },
                { label: 'Delete', value: 'delete', disabled: true },
              ]}
              onSelect={(value) => console.log('Selected:', value)}
            />
          </div>
        </Card>
      </section>
    </div>
  );
}
