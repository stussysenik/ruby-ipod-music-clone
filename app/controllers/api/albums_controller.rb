module Api
  class AlbumsController < ApplicationController
    def index
      albums = Album.includes(:tracks).order(:name)
      render json: albums.map { |a| album_json(a) }
    end

    def show
      album = Album.includes(:tracks).find(params[:id])
      render json: album_json(album).merge(
        tracks: album.tracks.order(:track_number).map do |t|
          { id: t.id, title: t.title, artist_name: t.artist_name,
            duration_seconds: t.duration_seconds, file_path: t.file_path,
            track_number: t.track_number }
        end
      )
    end

    private

    def album_json(album)
      {
        id: album.id,
        name: album.name,
        artist_name: album.artist_name,
        cover_image_path: album.cover_image_path,
        year: album.year,
        track_count: album.tracks.size
      }
    end
  end
end
