const { AuthenticationError, ForbiddenError } = require('./utils/errors');

const resolvers = {

  Query: {

    listing: (_, { id }, { dataSources }) => {
      //return {id: id}
      return dataSources.listingsAPI.getListing(id);
    },

    featuredListings: (_, { limit }, { dataSources }) => {

      return dataSources.listingsAPI.getFeaturedListings(limit);
    },

    searchListings: async (_, { criteria }, { dataSources }) => {
      
      const { numOfBeds, checkInDate, checkOutDate, page, limit, sortBy } = criteria;
    
      const listings = await dataSources.listingsAPI.getListings({ numOfBeds, page, limit, sortBy });

      // check availability for each listing
      const listingAvailability = await Promise.all(
        listings.map((listing) =>
          dataSources.bookingsDb.isListingAvailable({ listingId: listing.id, checkInDate, checkOutDate })
        )
      );

      // filter listings data based on availability
      const availableListings = listings.filter((listing, index) => listingAvailability[index]);

      return availableListings;
    },

    hostListings: async (_, __, { dataSources, userId, userRole }) => {
      if (!userId) throw AuthenticationError();

      if (userRole === 'Host') {
        return dataSources.listingsAPI.getListingsForUser(userId);
      } else {
        throw ForbiddenError('Only hosts have access to listings.');
      }
    },
  },

 Listing: {
  __resolveReference:(listing, { dataSources }) => {
    console.log(`__resolveReference ${JSON.stringify(listing)} ${JSON.stringify(listing.id)}`);
    return dataSources.listingsAPI.getListing(listing.id);
  },
  coordinates: (listing, { dataSources }) => {
    return dataSources.listingsAPI.getListingCoordinates(listing.id);
  }
 }
};

module.exports = resolvers;
