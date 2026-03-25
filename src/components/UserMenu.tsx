import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { User, LogOut } from 'lucide-react';

export default function UserMenu() {
  const { user, signOut } = useAuth();
  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-secondary hover:bg-accent">
          <User className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-3 py-2 border-b">
          <p className="text-xs text-muted-foreground">Акаунт</p>
          <p className="text-sm font-medium truncate">{user.email}</p>
        </div>
        <DropdownMenuItem onClick={signOut} className="text-destructive cursor-pointer">
          <LogOut className="h-4 w-4 mr-2" />
          Вийти
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
