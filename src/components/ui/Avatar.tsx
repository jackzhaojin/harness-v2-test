// Avatar component will be implemented here

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Avatar(_props: AvatarProps): JSX.Element {
  return <div>Avatar Placeholder</div>;
}
