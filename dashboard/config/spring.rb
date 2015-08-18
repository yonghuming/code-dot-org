# Configure Spring-specific settings.

# Listen >=2.8 throws errors on local symlinks to avoid watching the same files twice.
# Ref: https://github.com/guard/listen/pull/273
# We expect this behavior on locally-symlinked files, so this patch silences the noise.
require 'listen/record/symlink_detector'
module Listen
  class Record
    class SymlinkDetector
      def _fail(_, _)
        fail Error, "Don't watch locally-symlinked file twice"
      end
    end
  end
end

Spring.watch %w(
  ../lib
  ../shared
  ../deployment.rb
)
