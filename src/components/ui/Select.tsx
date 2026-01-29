// Select component will be implemented here

interface SelectProps {
  value?: string;
  onChange?: (value: string) => void;
}

export default function Select(_props: SelectProps): JSX.Element {
  return <select><option>Select Placeholder</option></select>;
}
