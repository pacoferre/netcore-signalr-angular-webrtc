using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace AngularAppWeb.Models
{
    public class User
    {
        private static readonly List<User> Users = new List<User>();

        public string UserName { get; set; }
        public string ConnectionId { get; set; }
        [JsonIgnore]
        public Room CurrentRoom { get; set; }

        public static void Remove(User user)
        {
            Users.Remove(user);
        }

        public static User Get(string connectionId)
        {
            return Users.SingleOrDefault(u => u.ConnectionId == connectionId);
        }

        public static User Get(string userName, string connectionId)
        {
            lock (Users)
            {
                var current = Users.SingleOrDefault(u => u.ConnectionId == connectionId);

                if (current == default(User))
                {
                    current = new User
                    {
                        UserName = userName,
                        ConnectionId = connectionId
                    };
                    Users.Add(current);
                }
                else
                {
                    current.UserName = userName;
                }

                return current;
            }
        }
    }
}
