// Button component will be implemented here

interface ButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
}

export default function Button(_props: ButtonProps): JSX.Element {
  return <button>Button Placeholder</button>;
}
