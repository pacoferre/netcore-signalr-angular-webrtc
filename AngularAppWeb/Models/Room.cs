using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AngularAppWeb.Models
{
    public class Room
    {
        private static readonly List<Room> Rooms = new List<Room>();

        public string Name { get; set; }
        public List<User> Users { get; set; } = new List<User>();

        public static int TotalUsers => Rooms.Sum(room => room.Users.Count);

        public static Room Get(string name)
        {
            lock (Rooms)
            {
                var current = Rooms.SingleOrDefault(r => r.Name == name);

                if (current == default(Room))
                {
                    current = new Room
                    {
                        Name = name
                    };
                    Rooms.Add(current);
                }

                return current;
            }
        }
    }
}
