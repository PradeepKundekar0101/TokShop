// Independent component - displays show info, can be commented out
interface ShowInfoProps {
  show?: any;
  isShowOwner?: boolean;
}

export function ShowInfo({ show, isShowOwner = false }: ShowInfoProps) {
  if (!show) return null;

  const showTitle = show?.title || 'Live Show';

  return (
    <div className="text-center p-8">
      <h1 className="text-2xl font-bold mb-4 text-white">{showTitle}</h1>
      <p className="text-zinc-400 mb-2">Show content will load here</p>
      {isShowOwner && (
        <p className="text-sm text-primary mt-4">
          You are the host
        </p>
      )}
      {!isShowOwner && (
        <p className="text-sm text-zinc-500 mt-4">
          You are viewing
        </p>
      )}
    </div>
  );
}
