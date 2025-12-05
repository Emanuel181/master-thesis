import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Calendar, Mail, MapPin } from "lucide-react";

export default function ProfileHeader({ user }) {
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'U';

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user?.image || ""} alt="Profile" />
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <Button
              size="icon"
              variant="outline"
              className="absolute -right-2 -bottom-2 h-8 w-8 rounded-full">
              <Camera />
            </Button>
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <h1 className="text-2xl font-bold">{user?.name || "User"}</h1>
              <Badge variant="secondary">{user?.role || "Member"}</Badge>
            </div>
            <p className="text-muted-foreground">{user?.title || ""}</p>
            <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
              {user?.email && (
                <div className="flex items-center gap-1">
                  <Mail className="size-4" />
                  {user.email}
                </div>
              )}
              {user?.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="size-4" />
                  {user.location}
                </div>
              )}
              {user?.joinedDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="size-4" />
                  Joined {user.joinedDate}
                </div>
              )}
            </div>
          </div>
          <Button variant="default">Edit Profile</Button>
        </div>
      </CardContent>
    </Card>
  );
}
