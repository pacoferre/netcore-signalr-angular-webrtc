using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AngularAppWeb.Hubs
{
    public class ChatHub : Hub
    {
        public Task Send(string message)
        {
            return Clients.All.SendAsync("Send", message);
        }

        public override Task OnConnectedAsync()
        {
            return base.OnConnectedAsync();
        }
    }
}
