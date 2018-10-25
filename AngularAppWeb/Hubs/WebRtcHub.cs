using AngularAppWeb.Models;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Threading.Tasks;

namespace AngularAppWeb.Hubs
{
    public class WebRtcHub : Hub
    {
#if DEBUG
        private string iceUser = "testuser";
#else
        private string iceUser = "produser";
#endif
        private static DateTime lastPassReset = DateTime.MinValue;

        public string GetConnectionId()
        {
            return Context.ConnectionId;
        }

        public RtcIceServer[] GetIceServers()
        {
            // Perhaps Ice server management.

            return new RtcIceServer[] { new RtcIceServer() { Username = "", Credential = "" } };
        } 

        public async Task Join(string userName, string roomName)
        {
            var user = User.Get(userName, Context.ConnectionId);
            var room = Room.Get(roomName);

            if (user.CurrentRoom != null)
            {
                room.Users.Remove(user);
                await SendUserListUpdate(Clients.Others, room, false);
            }

            user.CurrentRoom = room;
            room.Users.Add(user);

            await SendUserListUpdate(Clients.Caller, room, true);
            await SendUserListUpdate(Clients.Others, room, false);
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            await HangUp();

            await base.OnDisconnectedAsync(exception);
        }

        public async Task HangUp()
        {
            try
            {
                var callingUser = User.Get(Context.ConnectionId);

                if (callingUser == null)
                {
                    return;
                }

                if (callingUser.CurrentRoom != null)
                {
                    callingUser.CurrentRoom.Users.Remove(callingUser);
                    await SendUserListUpdate(Clients.Others, callingUser.CurrentRoom, false);
                }

                User.Remove(callingUser);
            }
            catch (Exception exp)
            {

            }
        }

        // WebRTC Signal Handler
        public async Task SendSignal(string signal, string targetConnectionId)
        {
            var callingUser = User.Get(Context.ConnectionId);
            var targetUser = User.Get(targetConnectionId);

            // Make sure both users are valid
            if (callingUser == null || targetUser == null)
            {
                return;
            }

            // These folks are in a call together, let's let em talk WebRTC
            await Clients.Client(targetConnectionId).SendAsync("receiveSignal", callingUser, signal);
        }

        private async Task SendUserListUpdate(IClientProxy to, Room room, bool callTo)
        {
            await to.SendAsync(callTo ? "callToUserList" : "updateUserList" , room.Name, room.Users);
        }
    }
}
