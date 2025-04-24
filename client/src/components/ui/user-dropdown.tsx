import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useTranslations } from '@/hooks/use-translations';
import { useLocation } from 'wouter';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, ShoppingBag, ChevronDown, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function UserDropdown() {
  const { user, logoutMutation } = useAuth();
  const { t } = useTranslations();
  const [, setLocation] = useLocation();
  
  if (!user) return null;
  
  const getInitials = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    } else if (user.firstName) {
      return user.firstName[0].toUpperCase();
    } else {
      return user.username[0].toUpperCase();
    }
  };
  
  const displayName = user.firstName || user.username;
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 hover:bg-gray-100 focus:ring-0 focus:ring-offset-0">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-white">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{displayName}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{t.myAccount}</DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => setLocation('/user/profile')} className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          <span>{t.profile || "Profile"}</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => setLocation('/user/orders')} className="cursor-pointer">
          <ShoppingBag className="mr-2 h-4 w-4" />
          <span>{t.myOrders}</span>
        </DropdownMenuItem>
        
        {user.isAdmin && (
          <DropdownMenuItem onClick={() => setLocation('/admin/dashboard')} className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>{t.admin}</span>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => logoutMutation.mutate()} 
          disabled={logoutMutation.isPending}
          className="cursor-pointer text-red-600 focus:text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{logoutMutation.isPending ? t.loggingOut : t.logout}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}