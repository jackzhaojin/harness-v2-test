// Input component will be implemented here

interface InputProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function Input(_props: InputProps): JSX.Element {
  return <input placeholder="Input Placeholder" />;
}
