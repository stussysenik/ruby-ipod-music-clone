module Api
  class ArtistsController < ApplicationController
    def index
      artists = Track.distinct.pluck(:artist_name).sort.map do |name|
        album_count = Album.where(artist_name: name).count
        track_count = Track.where(artist_name: name).count
        { name: name, album_count: album_count, track_count: track_count }
      end
      render json: artists
    end
  end
end
